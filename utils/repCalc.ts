export function calculateReputation(stats: {
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;
  discussionUpvotes: number;
  discussionDownvotes: number;
  commentUpvotes: number;
  commentDownvotes: number;
  acceptedAnswers: number;
}) {
  const skillScore = stats.solvedEasy * 5 + stats.solvedMedium * 15 + stats.solvedHard * 30;
  const discussionNet = stats.discussionUpvotes - stats.discussionDownvotes;
  const commentNet = stats.commentUpvotes - stats.commentDownvotes;
  const repSkill = Math.floor(10 * Math.log10(skillScore + 1));
  const repDisc = Math.floor(5 * Math.sqrt(Math.max(0, discussionNet)));
  const repComm = Math.floor(2 * Math.sqrt(Math.max(0, commentNet)));
  const bonus = stats.acceptedAnswers * 2;

  return repSkill + repDisc + repComm + bonus;
}
