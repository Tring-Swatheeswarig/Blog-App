import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/typeDefs.js";  
import resolvers from "./graphql/resolvers.js";  
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

const server = new ApolloServer({
  typeDefs,  
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || "";

    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, "swathi"); 
        console.log(token); 
      } catch (error) {
        console.error("Invalid token:", error.message);
      }
    }
    console.log(user);
    return { user }; 
  },
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  app.listen(4000, () =>
    console.log("Server running on http://localhost:4000/graphql")
  );
}

startServer();
