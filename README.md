# prestonmontewest-api

The API server for my blog.

## Routes

### Get All Posts

Retrieves all posts from the PostgreSQL `post` table. Below are the possible query parameters.

#### Limit

Limits the number of posts retrieved to be less than or equal to what is passed.

```
post?limit=3
```

The above query limits the length of the array returned by 3.

### Create Post

Create a new post in the PostgreSQL `post` table with a title and content.

### Get Post By Title

Retrieves a single post from PostgreSQL `post` table using a title.

```
post/My Post Title
```

This gets a post named 'My Post Title' if it exists; otherwise, it returns a 404.

## Versioning

This project uses [semantic versioning 2.0.0](https://semver.org/).
