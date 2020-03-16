export class Post {
  constructor(
    public title: string,
    public summary: string,
    public content: string,
    public image: string,
    public searchTitle?: string,
    public publishDate?: Date,
    public editDate?: Date
  ) {}
}
