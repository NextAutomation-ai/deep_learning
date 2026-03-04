import { db } from "@/lib/db";
import { contents, concepts, questions, flashcards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { ContentTabs } from "@/components/content-detail/content-tabs";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const session = await getUser();
  const { contentId } = await params;

  const [content] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.id, contentId), eq(contents.userId, session.user.id)))
    .limit(1);

  if (!content) redirect("/library");

  const conceptCount = (await db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId))).length;

  const questionCount = (await db
    .select()
    .from(questions)
    .where(eq(questions.contentId, contentId))).length;

  const flashcardCount = (await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.contentId, contentId))).length;

  return (
    <ContentTabs
      content={{
        id: content.id,
        title: content.title,
        sourceType: content.sourceType,
        processingStatus: content.processingStatus,
        conceptCount,
        questionCount,
        flashcardCount,
      }}
    />
  );
}
