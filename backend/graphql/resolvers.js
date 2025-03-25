import client from "../db/conn.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { finished } from "stream/promises";

const resolvers = {
  Query: {
    getUsers: async () => {
      const { rows } = await client.query("SELECT id, name, email FROM users");
      return rows;
    },
    getBlogs: async (_, { category }) => {
      if (category) {
        const { rows } = await client.query(
          "SELECT * FROM blogs WHERE category = $1 ORDER BY created_at DESC",
          [category]
        );
        return rows;
      }
      const { rows } = await client.query("SELECT * FROM blogs ORDER BY created_at DESC");
      return rows;
    },
    getBlogById: async (_, { id }) => {
      const { rows } = await client.query("SELECT * FROM blogs WHERE id = $1", [id]);
      return rows[0];
    }
  },
  Mutation: {
    signup: async (_, { name, email, password }) => {
      try {
        const existingUser = await client.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
          throw new Error("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query(
          "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
          [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, "swathi", { expiresIn: "1d" });

        return { token, user };
      } catch (err) {
        console.error("Error signing up:", err);
        throw err;
      }
    },
    signin: async (_, { email, password }) => {
      const { rows } = await client.query("SELECT * FROM users WHERE email = $1", [email]);
      if (rows.length === 0) {
        throw new Error("User not found");
      }

      const user = rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error("Invalid password");
      }

      const token = jwt.sign({ userId: user.id }, "swathi", { expiresIn: "1d" });

      return { token, user: { id: user.id, name: user.name, email: user.email } };
    },
    createBlog: async (_, { title, image, post, category }, context) => {
      if (!context.user || !context.user.userId) {
        throw new Error("You must be logged in to create a blog post");
      }

      try {
        const result = await client.query(
          "INSERT INTO blogs (title, image, post, category, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [title, image, post, category, context.user.userId]
        );
        return result.rows[0];
      } catch (err) {
        console.error("Error creating blog:", err);
        throw err;
      }
    },
    updateBlog: async (_, { id, title, image, post, category }, context) => {
      if (!context.user || !context.user.userId) {
        throw new Error("You must be logged in to update a blog post");
      }

      try {
        const { rows } = await client.query("SELECT user_id FROM blogs WHERE id = $1", [id]);
        if (rows.length === 0) {
          throw new Error("Blog post not found");
        }
        
        // Check if the logged-in user is the creator of the blog
        if (rows[0].user_id !== context.user.userId) {
          throw new Error("You are not authorized to edit this blog post");
        }

        const result = await client.query(
          "UPDATE blogs SET title = $1, image = $2, post = $3, category = $4 WHERE id = $5 RETURNING *",
          [title, image, post, category, id]
        );

        return result.rows[0];
      } catch (err) {
        console.error("Error updating blog:", err);
        throw err;
      }
    },
    deleteBlog: async (_, { id }, context) => {
      if (!context.user || !context.user.userId) {
        throw new Error("You must be logged in to delete a blog post");
      }

      try {
        const { rows } = await client.query("SELECT user_id FROM blogs WHERE id = $1", [id]);
        if (rows.length === 0) {
          throw new Error("Blog post not found");
        }

        // Check if the logged-in user is the creator of the blog
        if (rows[0].user_id !== context.user.userId) {
          throw new Error("You are not authorized to delete this blog post");
        }

        await client.query("DELETE FROM blogs WHERE id = $1", [id]);

        return {
          success: true,
          message: "Blog deleted successfully",
        };
      } catch (err) {
        console.error("Error deleting blog:", err);
        throw err;
      }
    },
    uploadFile: async (_, { file }) => {
      const { createReadStream, filename } = await file;
      const uniqueFilename = `${Date.now()}-${filename}`;
      const uploadPath = path.join(process.cwd(), "uploads", uniqueFilename);

      const stream = createReadStream();
      const out = fs.createWriteStream(uploadPath);
      stream.pipe(out);
      await finished(out);

      return `/uploads/${uniqueFilename}`;
    }
  }
};

export default resolvers;
