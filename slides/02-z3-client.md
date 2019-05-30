## GraphQL Client

<small>Issue GraphQL Queries and consume responses</small>
<pre id="left">
<small>
query {
    user(id:1) {
        id
        name
        posts {
            id
            title
        }
    }
}
</small>
</pre>
<pre id="right">
<small>
{
  "data": {
    "user": {
      "id": "1",
      "name": "Гошо",
      "posts": [
        {
          "id": "1",
          "title": "First Post"
        },
        {
          "id": "2",
          "title": "Second Post"
        }
      ]
    }
  }
}
</small>
</pre>
