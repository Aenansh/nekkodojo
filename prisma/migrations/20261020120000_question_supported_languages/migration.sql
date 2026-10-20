CREATE TABLE "_QuestionSupportedLanguages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_QuestionSupportedLanguages_AB_unique"
    ON "_QuestionSupportedLanguages"("A", "B");

CREATE INDEX "_QuestionSupportedLanguages_B_index"
    ON "_QuestionSupportedLanguages"("B");

ALTER TABLE "_QuestionSupportedLanguages"
    ADD CONSTRAINT "_QuestionSupportedLanguages_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Language"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_QuestionSupportedLanguages"
    ADD CONSTRAINT "_QuestionSupportedLanguages_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Question"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'Language'
          AND column_name = 'questionId'
    ) THEN
        EXECUTE '
            INSERT INTO "_QuestionSupportedLanguages" ("A", "B")
            SELECT "id", "questionId"
            FROM "Language"
            WHERE "questionId" IS NOT NULL
            ON CONFLICT ("A", "B") DO NOTHING
        ';

        ALTER TABLE "Language" DROP COLUMN "questionId" CASCADE;
    END IF;
END
$$;

INSERT INTO "_QuestionSupportedLanguages" ("A", "B")
SELECT language."id", question."id"
FROM "Language" AS language
CROSS JOIN "Question" AS question
WHERE language."isSupported" = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM "_QuestionSupportedLanguages" AS existing
      WHERE existing."B" = question."id"
  )
ON CONFLICT ("A", "B") DO NOTHING;
