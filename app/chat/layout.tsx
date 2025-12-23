import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Communicate with your team members and project managers",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

