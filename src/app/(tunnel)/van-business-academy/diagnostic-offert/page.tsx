import type { Metadata } from "next";
import BookingClient from "./BookingClient";

export const metadata: Metadata = {
  title: "Réserver un appel | Van Business Academy",
  robots: { index: false, follow: false },
};

export default function BookingPage() {
  return <BookingClient />;
}
