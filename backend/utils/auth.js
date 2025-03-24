import bcrypt from "bcryptjs";
import  jwt from "jsonwebtoken";
const JWT_SECRET_KEY = "swathi";
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET_KEY, { expiresIn: "1d" });
};
const verifyToken = (token) => { 
    try {
        const decodedToken=jwt.verify(token,JWT_SECRET_KEY);
        return decodedToken;

    }
    catch (err) {
       throw new Error("Invalid Token");
    }
};

export{hashPassword,comparePassword,generateToken,verifyToken,JWT_SECRET_KEY};
