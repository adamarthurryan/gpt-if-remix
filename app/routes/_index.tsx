import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";

import { json, redirect } from "@remix-run/node";
import { 
  Form,
  Link,
  Outlet,
  NavLink,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

import invariant from "tiny-invariant";

import { getStories } from "../data";

export const loader = async ({
}: LoaderFunctionArgs) => {
  return redirect("/story");
};

