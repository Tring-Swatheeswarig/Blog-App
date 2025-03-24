import { gql } from "graphql-tag";

const typeDefs = gql`
  scalar Upload

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Blog {
    id: ID!
    title: String!
    image: String!
    post: String!
    category: String!
    user_id: ID
    created_at: String
  }

  type Auth {
    token: String!
    user: User!
  }

  type DeleteResponse {
    success: Boolean!
    message: String
  }

  type Query {
    getUsers: [User]
    getBlogs(category: String): [Blog]
    getBlogById(id: ID!): Blog
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!): Auth
    signin(email: String!, password: String!): Auth
    createBlog(title: String!, image: String!, post: String!, category: String!): Blog
    updateBlog(id: ID!, title: String!, image: String!, post: String!, category: String!): Blog
    deleteBlog(id: ID!): DeleteResponse
    uploadFile(file: Upload!): String
  }
`;

export { typeDefs };
