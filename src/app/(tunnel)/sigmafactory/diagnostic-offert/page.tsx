import type { Metadata } from "next";
import BookingClient from "./BookingClient";

export const metadata: Metadata = {
  title: "Reserver un appel | Sigma Factory",
  robots: { index: false, follow: false },
};

export default function SigmaBookingPage() {
  return <BookingClient />;
}
