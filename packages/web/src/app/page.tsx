"use client";

import { useEffect, useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { Button, ChakraProvider, Spinner, useToast } from "@chakra-ui/react";

const API_URL = "http://localhost:8080/api";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [isInit, setIsInit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const checkIsLogin = async () => {
    try {
      console.log("checkIsLogin");
      const res = await fetch(`${API_URL}/check-login`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setLoggedInUserName(data.name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInit(true);
    }
  };

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  const handleRegister = async () => {
    setUserName("");
    setIsLoading(true);
    try {
      const credentialOptionRes = await fetch(`${API_URL}/registration/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName }),
        credentials: "include",
      });
      const credentialOption = await credentialOptionRes.json();
      if (!credentialOptionRes.ok) {
        setIsLoading(false);
        toast({
          title: "Failed to register",
          description: credentialOption.error,
          status: "error",
          duration: 1000,
          isClosable: true,
        });
        return;
      }

      console.log("credentialOption", credentialOption);
      const publicKeyCredential = await startRegistration(credentialOption);
      console.log("publicKeyCredential", publicKeyCredential);
      const verifyRegistrationData = await fetch(
        `${API_URL}/registration/finish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(publicKeyCredential),
          credentials: "include",
        }
      );
      const verifyAttestation = await verifyRegistrationData.json();
      if (!verifyRegistrationData.ok) {
        setIsLoading(false);
        toast({
          title: "Failed to verify attestation",
          description: verifyAttestation.error,
          status: "error",
          duration: 1000,
          isClosable: true,
        });
        return;
      }
      toast({
        title: "Register success",
        description: verifyAttestation.message,
        status: "success",
        duration: 1000,
        isClosable: true,
      });
    } catch (e) {
      console.error("registration error", e);
      toast({
        title: "Failed to register",
        description: (e as Error).message,
        status: "error",
        duration: 1000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setUserName("");
      setIsLoading(true);
      const credentialOptionRes = await fetch(`${API_URL}/login/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName }),
        credentials: "include",
      });

      const credentialOption = await credentialOptionRes.json();
      if (!credentialOptionRes.ok) {
        setIsLoading(false);
        toast({
          title: "Failed to login",
          description: credentialOption.error,
          status: "error",
          duration: 1000,
          isClosable: true,
        });
        return;
      }
      console.log("credentialOption", credentialOption);
      const assertionRes = await startAuthentication(credentialOption);
      console.log("assertionResponse", assertionRes);
      const verifyAssertionRes = await fetch(`${API_URL}/login/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assertionRes),
        credentials: "include",
      });
      const verifyAssertionData = await verifyAssertionRes.json();
      if (!verifyAssertionRes.ok) {
        setIsLoading(false);
        toast({
          title: "Failed to verify attestation",
          description: verifyAssertionData.error,
          status: "error",
          duration: 1000,
          isClosable: true,
        });
        return;
      }
      toast({
        title: "Login success",
        description: verifyAssertionData.message,
        status: "success",
        duration: 1000,
        isClosable: true,
      });
      setLoggedInUserName(userName);
      return;
    } catch (e) {
      setUserName("");
      toast({
        title: "Failed to login",
        description: (e as Error).message,
        status: "error",
        duration: 1000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      setLoggedInUserName("");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkIsLogin();
  }, []);

  if (!isInit) {
    return;
  }

  return (
    <ChakraProvider toastOptions={{ defaultOptions: { position: "bottom" } }}>
      <main className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-10">Passkey Login</h1>
        <div className="flex flex-col gap-4">
          {loggedInUserName.length > 0 ? (
            <>
              <h2>Welcome {loggedInUserName}</h2>
              <Button colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : isLoading ? (
            <Spinner />
          ) : (
            <>
              <input
                className="block w-full rounded-md border-0  text-gray-900 p-2 ring-1 ring-inset ring-gray-300 "
                type="text"
                name="userName"
                id="userName"
                placeholder="User Name"
                value={userName}
                onChange={handleUserNameChange}
                required
              />
              <div className="flex gap-2 justify-around">
                <Button colorScheme="gray" onClick={handleRegister}>
                  Register
                </Button>
                <Button colorScheme="green" onClick={handleLogin}>
                  Login
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </ChakraProvider>
  );
}
