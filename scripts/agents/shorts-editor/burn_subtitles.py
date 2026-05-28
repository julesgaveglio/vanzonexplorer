#!/usr/bin/env python3
"""
burn_subtitles.py — Burn animated word-by-word subtitles (CapCut-style) onto a video.

Uses pycaps for rendering. Falls back to FFmpeg ASS if pycaps fails.

Usage:
  python3 burn_subtitles.py \
    --input /tmp/vanzon-shorts-editor/04-qc-cut.mp4 \
    --whisper-json /tmp/vanzon-shorts-editor/01-no-silence.json \
    --output /tmp/vanzon-shorts-editor/05-subtitled.mp4 \
    --segments-to-keep '[0,1,3,5]' \
    --time-offsets '{"0":{"originalStart":0.5,"newStart":0},"1":{"originalStart":3.2,"newStart":2.1}}'
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile


CSS_STYLE = """
.segment {
    font-family: 'Montserrat', 'Arial Black', 'Helvetica Neue', sans-serif;
    font-weight: 900;
    font-size: 56px;
    color: #FFFFFF;
    text-transform: uppercase;
    text-align: center;
    letter-spacing: 2px;
    -webkit-text-stroke: 2px #000000;
    text-shadow:
        3px 3px 0px #000000,
        -1px -1px 0px #000000,
        1px -1px 0px #000000,
        -1px 1px 0px #000000;
    padding: 8px 16px;
}

.word {
    display: inline-block;
    margin: 0 4px;
}

.word.active {
    color: #FFD700;
    transform: scale(1.1);
}
"""


def remap_whisper_json(whisper_path: str, time_offsets: dict, segments_to_keep: set) -> dict:
    """
    Read original whisper JSON, filter to kept segments only,
    and remap word timestamps to the new output timeline.
    """
    with open(whisper_path) as f:
        data = json.load(f)

    remapped_segments = []
    for seg in data.get("segments", []):
        seg_id = seg["id"]
        if seg_id not in segments_to_keep:
            continue

        offset_key = str(seg_id)
        if offset_key not in time_offsets:
            continue

        offset_info = time_offsets[offset_key]
        time_shift = offset_info["newStart"] - offset_info["originalStart"]

        new_seg = {
            "id": len(remapped_segments),
            "start": seg["start"] + time_shift,
            "end": seg["end"] + time_shift,
            "text": seg["text"],
            "words": [
                {
                    "word": w["word"],
                    "start": w["start"] + time_shift,
                    "end": w["end"] + time_shift,
                }
                for w in seg.get("words", [])
                if "start" in w and "end" in w
            ],
        }
        remapped_segments.append(new_seg)

    return {"segments": remapped_segments, "language": "fr"}


def burn_with_pycaps(input_path: str, remapped_json_path: str, output_path: str) -> bool:
    """Attempt to burn subtitles using pycaps. Returns True on success."""
    try:
        from pycaps import (
            CapsPipelineBuilder,
            PopIn,
            LimitByWordsSplitter,
            SubtitleLayoutOptions,
            VerticalAlignment,
            VerticalAlignmentType,
            VideoQuality,
            EventType,
            ElementType,
        )

        pipeline = (
            CapsPipelineBuilder()
            .with_input_video(input_path)
            .with_output_video(output_path)
            .with_transcription_file(remapped_json_path, format="whisper_json")
            .add_segment_splitter(LimitByWordsSplitter(limit=3))
            .with_layout_options(
                SubtitleLayoutOptions(
                    max_width_ratio=0.9,
                    max_number_of_lines=1,
                    min_number_of_lines=1,
                    vertical_align=VerticalAlignment(
                        align=VerticalAlignmentType.CENTER,
                        offset=0.15,
                    ),
                )
            )
            .add_css_content(CSS_STYLE)
            .add_animation(PopIn(duration=0.15), EventType.ON_NARRATION_STARTS, ElementType.WORD)
            .with_video_quality(VideoQuality.HIGH)
            .build()
        )

        pipeline.run()
        return os.path.exists(output_path) and os.path.getsize(output_path) > 1000

    except Exception as e:
        print(f"[pycaps] Erreur: {e}", file=sys.stderr)
        return False


def generate_ass_subtitles(remapped_data: dict, ass_path: str):
    """Generate ASS subtitle file as fallback."""
    header = """[Script Info]
Title: YouTube Shorts Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,52,&H00FFFFFF,&H0000D7FF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,3,0,5,40,40,500,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for seg in remapped_data.get("segments", []):
        words = seg.get("words", [])
        if not words:
            # Fall back to segment-level
            start_ass = _seconds_to_ass(seg["start"])
            end_ass = _seconds_to_ass(seg["end"])
            text = seg["text"].strip().upper()
            # Show max 3 words at a time
            word_list = text.split()
            for i in range(0, len(word_list), 3):
                chunk = " ".join(word_list[i : i + 3])
                chunk_start = seg["start"] + (seg["end"] - seg["start"]) * (i / max(len(word_list), 1))
                chunk_end = seg["start"] + (seg["end"] - seg["start"]) * (min(i + 3, len(word_list)) / max(len(word_list), 1))
                events.append(
                    f"Dialogue: 0,{_seconds_to_ass(chunk_start)},{_seconds_to_ass(chunk_end)},Default,,0,0,0,,{{\\an5}}{chunk}"
                )
        else:
            # Word-level: group into chunks of 3
            for i in range(0, len(words), 3):
                chunk_words = words[i : i + 3]
                chunk_start = chunk_words[0]["start"]
                chunk_end = chunk_words[-1]["end"]
                chunk_text = " ".join(w["word"].strip().upper() for w in chunk_words)
                events.append(
                    f"Dialogue: 0,{_seconds_to_ass(chunk_start)},{_seconds_to_ass(chunk_end)},Default,,0,0,0,,{{\\an5}}{chunk_text}"
                )

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("\n".join(events))
        f.write("\n")


def _seconds_to_ass(seconds: float) -> str:
    """Convert seconds to ASS timestamp format H:MM:SS.CC"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def burn_with_ffmpeg_ass(input_path: str, remapped_data: dict, output_path: str) -> bool:
    """Fallback: burn ASS subtitles via FFmpeg."""
    try:
        ass_path = input_path.replace(".mp4", "-subs.ass")
        generate_ass_subtitles(remapped_data, ass_path)

        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-vf", f"ass={ass_path}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "22",
            "-c:a", "copy",
            output_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 1000

    except Exception as e:
        print(f"[ffmpeg-ass] Erreur: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Burn animated subtitles onto video")
    parser.add_argument("--input", required=True, help="Input video path")
    parser.add_argument("--whisper-json", required=True, help="Whisper JSON transcript path")
    parser.add_argument("--output", required=True, help="Output video path")
    parser.add_argument("--segments-to-keep", required=True, help="JSON array of segment IDs to keep")
    parser.add_argument("--time-offsets", required=True, help="JSON object mapping segment IDs to time offsets")
    args = parser.parse_args()

    segments_to_keep = set(json.loads(args.segments_to_keep))
    time_offsets = json.loads(args.time_offsets)

    # Remap whisper timestamps to new timeline
    remapped_data = remap_whisper_json(args.whisper_json, time_offsets, segments_to_keep)

    if not remapped_data["segments"]:
        print("ERREUR: Aucun segment a sous-titrer", file=sys.stderr)
        sys.exit(1)

    # Write remapped JSON
    remapped_path = os.path.join(os.path.dirname(args.output), "remapped-whisper.json")
    with open(remapped_path, "w") as f:
        json.dump(remapped_data, f, ensure_ascii=False, indent=2)

    print(f"[subtitles] {len(remapped_data['segments'])} segments a sous-titrer")

    # Try pycaps first
    print("[subtitles] Tentative pycaps...")
    if burn_with_pycaps(args.input, remapped_path, args.output):
        print("[subtitles] pycaps OK")
        return

    # Fallback to FFmpeg ASS
    print("[subtitles] pycaps echoue, fallback FFmpeg ASS...")
    if burn_with_ffmpeg_ass(args.input, remapped_data, args.output):
        print("[subtitles] FFmpeg ASS OK")
        return

    print("ERREUR: Impossible de bruler les sous-titres (pycaps + ASS ont echoue)", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
