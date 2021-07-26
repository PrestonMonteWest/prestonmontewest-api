import { Readable } from "stream";
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

interface File {
  /** Name of the form field associated with this file. */
  fieldname: string;
  /** Name of the file on the uploader's computer. */
  originalname: string;
  /**
   * Value of the `Content-Transfer-Encoding` header for this file.
   * @deprecated since July 2015
   * @see RFC 7578, Section 4.7
   */
  encoding: string;
  /** Value of the `Content-Type` header for this file. */
  mimetype: string;
  /** Size of the file in bytes. */
  size: number;
  /**
   * A readable stream of this file. Only available to the `_handleFile`
   * callback for custom `StorageEngine`s.
   */
  stream: Readable;
  /** `DiskStorage` only: Directory to which this file has been uploaded. */
  destination: string;
  /** `DiskStorage` only: Name of this file within `destination`. */
  filename: string;
  /** `DiskStorage` only: Full path to the uploaded file. */
  path: string;
  /** `MemoryStorage` only: A Buffer containing the entire file. */
  buffer: Buffer;
}

export interface CreatePostRequest {
  title: string;
  summary: string;
  content: string;
  image: File;
}
