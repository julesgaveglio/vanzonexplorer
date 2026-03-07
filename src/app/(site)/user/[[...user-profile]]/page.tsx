import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <section className="py-20 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <UserProfile path="/user" routing="path" />
      </div>
    </section>
  );
}
