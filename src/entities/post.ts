import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum PostCategory {
  politics = 'politics',
  science = 'science',
  finance = 'finance',
  philosophy = 'philosophy',
  technology = 'technology',
  food = 'food',
  news = 'news',
  personal = 'personal',
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  title: string;

  @Column("text")
  summary: string;

  @Column("text")
  content: string;

  @Column()
  image: string;

  @Column({
    type: "enum",
    enum: PostCategory,
    default: PostCategory.personal
  })
  category: PostCategory;

  @Column('timestamp without time zone', { nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  publishDate: Date;

  @Column({ nullable: false, default: 0 })
  viewCount: number;
}

export interface CreatePostRequest {
  title: string;
  summary: string;
  content: string;
  image: any;
}
