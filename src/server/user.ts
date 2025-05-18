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
  email: string;
  superUser: boolean;
}

connect();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiration = process.env.JWT_EXPIRATION || "1h"; // Default to 20 minutes


// Fetch the user profile from the JWT token in cookies
const GetProfileData = async (): Promise<User> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  if (!token) {
    console.log("No token found in cookies.");
    redirect("/");
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    return decodedToken as User;
  } catch (error: any) {
    console.log("JWT verification error:", error.message);
    redirect("/");

    // Return fallback empty user (Optional for type safety)
    return {
      id: "",
      userName: "",
      email: "",
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
    email: userExists.email,
    superUser: userExists.superUser,
  };
  
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration });
  const cookieStore = await cookies();


  cookieStore.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 40 * 60, // 40 minutes in seconds
    sameSite: "strict",
  });

  return { status: "success", message: "User logged in" };
}

async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}

async function addUser(userName: string, email: string, password: string, superUser: boolean) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserDB.create({
      userName,
      email,
      password: hashedPassword,
      superUser,
    });
    const userData = {
      id: user._id.toString(),
      userName: user.userName,
      email: user.email,
      superUser: user.superUser,
    };
    return { status: "success", message: userData };
  } catch (error: any) {
    console.log("Error in adding user:", error.message);
    return { status: "error", message: error.message };
  }

}

async function changePassword(userName: string, oldPassword: string, newPassword: string) {
  const user = await UserDB.findOne({userName});
  if (!user) {
    return { status: "error", message: "User not found" };
  }
  
  const passwordMatch = await bcrypt.compare(oldPassword, user.password);
  if (!passwordMatch) {
    return { status: "error", message: "Old password didn't match" };
  }

  const oldPasswordMatch = await bcrypt.compare(newPassword, user.password);
  if (oldPasswordMatch) {
    return { status: "error", message: "New password should be different from the old password" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  return { status: "success", message: "Password changed successfully" };
}

async function changeEmail(userName: string, newEmail: string) {
  const user = await UserDB.findOne({userName});
  if (!user) {
    return { status: "error", message: "User not found" };
  }
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  user.email = newEmail;
  await user.save();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { status: 'error', message: 'No token found in cookies, cannot update token.' };
  }

  // Decode token without verifying signature to get `exp`
  const decodedToken: any = jwt.decode(token);
  if (!decodedToken || !decodedToken.exp) {
    return { status: 'error', message: 'Failed to decode token, cannot retrieve expiration.' };
  }

  // Calculate remaining time (exp - current time) to preserve maxAge
  const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
  const remainingSeconds = decodedToken.exp - currentTime;
  if (remainingSeconds <= 0) {
    return { status: 'error', message: 'Token already expired, please log in again.' };
  }

  // Create new token with updated email and same payload
  const updatedPayload = {
    id: decodedToken.id,
    userName: decodedToken.userName,
    email: newEmail,
    superUser: decodedToken.superUser,
  };

  const newToken = jwt.sign(updatedPayload, jwtSecret, { expiresIn: remainingSeconds });

  // Set new token with the exact same maxAge as remaining lifetime
  cookieStore.set('token', newToken, {
    httpOnly: true,
    path: '/',
    maxAge: remainingSeconds, // keep it in sync with JWT exp
    sameSite: 'strict',
  });
  return { status: "success", message: "Email changed successfully" };
}

async function discordFeature(userName: string, isDiscordEnabled: boolean): Promise<{status:string; message:string}> {
  console.log(`Discord feature toggled for ${userName}: ${isDiscordEnabled}`);
  
  return { status: "success", message: "Discord feature updated (stub)." };
}

export { login, GetProfileData, logout, addUser, changePassword, changeEmail, discordFeature };
