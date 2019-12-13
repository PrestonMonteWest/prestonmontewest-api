# prestonmontewest-api
The API server for my website.

## Routes
### Get All Posts
Retrieves all posts from DynamoDB Post table. Below are the possible query params.
#### Limit
Limits the number of posts retrieved to be less than or equal to what is passed.
```
post?limit=3
```
The above query limits the length of the array returned by 3.

### Put Post
Create a new post in the DynamoDB Post table with a title and content.

### Get Post By Title
Retrieves a single post from DynamoDB Post table using a title.
```
post/My Post Title
```
This gets a post named 'My Post Title' if it exists; otherwise, it returns a 404.
