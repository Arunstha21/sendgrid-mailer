"use server";

import connect from "@/lib/database/connect";
import { UserDB } from "@/lib/database/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface User {
  id: string;
  userName: string;
  superUser: boolean;
}

connect();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiration = process.env.JWT_EXPIRATION || "20m"; // Default to 20 minutes


// Fetch the user profile from the JWT token in cookies
const GetProfileData = async (): Promise<User> => {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    console.error("No token found in cookies.");
    redirect("/");
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    
    return decodedToken as User;
  } catch (error: any) {
    console.error("JWT verification error:", error.message);
    redirect("/");

    // Return fallback empty user (Optional for type safety)
    return {
      id: "",
      userName: "",
      superUser: false,
    };
  }
};

// Handle user login
async function login(userName: string, password: string) {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }
  

  const userExists = await UserDB.findOne({ userName });
  if (!userExists) {
    return { status: "error", message: "User Name or Password didn't match" };
  }

  const passwordMatch = await bcrypt.compare(password, userExists.password);
  if (!passwordMatch) {
    return { status: "error", message: "User Name or Password didn't match" };
  }


  const payload = {
    id: userExists._id,
    userName: userExists.userName,
    superUser: userExists.superUser,
  };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration });
  const cookieStore = await cookies();


  cookieStore.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 20 * 60, // 20 minutes in seconds
    sameSite: "strict",
  });

  return { status: "success", message: "User logged in" };
}

async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}

async function addUser(userName: string, password: string, superUser: boolean) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserDB.create({
      userName,
      password: hashedPassword,
      superUser,
    });
    const userData = {
      id: user._id.toString(),
      userName: user.userName,
      superUser: user.superUser,
    };
    return { status: "success", message: userData };
  } catch (error: any) {
    console.error("Error in adding user:", error.message);
    return { status: "error", message: error.message };
  }

}

export { login, GetProfileData, logout, addUser };
