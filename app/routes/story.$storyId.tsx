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

import { getPages, updateStory } from "../data";

export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  const pages = await getPages(params.storyId);
  return json({ pages });
};

export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  await updateStory(params.storyId, updates);
  return null; //redirect(`/contacts/${params.contactId}`);
};

export default function EditStory() {
  const { pages } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();

  return (
    <div class="flex">
      <div id="sidebar">
      <h1>gpt if</h1>
      <nav>
      {pages.length ? (
          <ul>
            {pages.map((page) => (
              <li key={page.id}>
                <NavLink
                  className={({ isActive, isPending }) =>
                    isActive
                      ? "active"
                      : isPending
                      ? "pending"
                      : ""
                  }
                  to={`page/${page.id}`}
                >
                  {page.prompt ? (
                    <>
                      {page.prompt}
                    </>
                  ) : (
                    <i>No Prompt</i>
                  )}{" "}
                  </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            <i>No pages</i>
          </p>
        )}
      </nav>
    </div>

    <div
      className={
        navigation.state === "loading" ? "loading" : ""
      }
      id="detail"
    >
      <Outlet />
    </div>
  </div>
  );
}
