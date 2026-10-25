type CommentTreeNode<T> = T & { replies: CommentTreeNode<T>[] };

export function buildCommentTree<
  T extends { id: string; parentId?: string | null; createdAt: string | Date },
>(flatComments: T[]): CommentTreeNode<T>[] {
  const commentMap: Record<string, CommentTreeNode<T>> = {};
  const rootComments: CommentTreeNode<T>[] = [];

  flatComments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  flatComments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap[comment.parentId];
      
      if (parent && parent.replies) {
        parent.replies.push(commentMap[comment.id]);
      }
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  const sortReplies = (comments: CommentTreeNode<T>[]) => {
    comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    comments.forEach((c) => {
      if (c.replies?.length) sortReplies(c.replies);
    });
  };

  rootComments.forEach((comment) => sortReplies(comment.replies ?? []));
  return rootComments;
}