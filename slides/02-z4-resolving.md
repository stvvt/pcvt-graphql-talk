### GraphQL Query Resolution Flow

<div id="left">
<pre>
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

<pre>
<small>
# Schema SDL (shortened)
type User {
    id: ID!
    name: String!
    posts: [Post!]! # -> userPostsResolver(user)
}

type Post {
    id: ID!
    title: String!
}

# Root query type - MANDATORY
type Query {
    user(id: ID!): User! # -> queryUserResolver(root, { id })
}
</small>
</pre>
</div>
<div id="right">
<small>
<ol>
<li>Resolve <code>user</code> field of root query type: <code>queryUsersResolver(root, { id }) => user</code><br/>&nbsp;
<li>
    With above user
    <ol>
    <li>Resolve <code>id</code> field of <code>User</code> type: <code>(user) => user.id</code><br/>&nbsp;
    <li>Resolve <code>name</code> field of <code>User</code> type: <code>(user) => user.name</code><br/>&nbsp;
    <li>Resolve <code>posts</code> field of <code>User</code> type: <code>userPostsResolver(user) => array of Post</code><br/>&nbsp;
    <li>
        With each post
        <ol>
        <li>Resolve <code>id</code> field of <code>Post</code> type: <code>(post) => post.id</code>
        <li>Resolve <code>title</code> field of <code>Post</code> type: <code>(post) => post.title</code><br/>&nbsp;
        </ol>
    </li>
    </ol>
</li>
</ol>
</small>
</div>
