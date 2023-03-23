export enum PostCategory {
  politics = 'Politics',
  programming = 'Programming',
  science = 'Science',
  finance = 'Finance',
  philosophy = 'Philosophy',
  technology = 'Technology',
  media = 'Media',
  food = 'Food',
}

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: PostCategory;
  publishTime: string;
  viewCount: number;
}

interface BaseCreatePost {
  title: string;
  summary: string;
  content: string;
  category: PostCategory;
}

export interface CreatePostRequestBody extends BaseCreatePost {
  imageUrl?: string;
}

export interface PgCreatePostRequest extends BaseCreatePost {
  image_url: string;
  created_by: string;
}
