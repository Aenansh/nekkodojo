export function buildCommentTree(flatComments: any[]): CommentProps[] {
  const commentMap: Record<string, any> = {};
  const rootComments: any[] = [];

  flatComments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  flatComments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap[comment.parentId];
      
      if (parent) {
        parent.replies.push(commentMap[comment.id]);
      }
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  const sortReplies = (comments: any[]) => {
    comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    comments.forEach((c) => {
      if (c.replies.length > 0) sortReplies(c.replies);
    });
  };
  

  return rootComments;
}