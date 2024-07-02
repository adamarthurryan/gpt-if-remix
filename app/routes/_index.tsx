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
  const stories = await getStories();
  return json({ stories });
};

export default function Index() {
  const { stories } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();

  return (
    <div id="sidebar">
    <h1>gpt if</h1>
    <div>
      <Form method="post" action="stories">
        <button type="submit">New Story</button>
      </Form>
    </div>
    <nav>
    {stories.length ? (
        <ul>
          {stories.map((story) => (
            <li key={story.id}>
              <NavLink
                className={({ isActive, isPending }) =>
                  isActive
                    ? "active"
                    : isPending
                    ? "pending"
                    : ""
                }
                to={`story/${story.id}`}
              >
                {story.title ? (
                  <>
                    {story.title}
                  </>
                ) : (
                  <i>No Title</i>
                )}{" "}
                </NavLink>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          <i>No contacts</i>
        </p>
      )}
    </nav>
    </div>  );
}
