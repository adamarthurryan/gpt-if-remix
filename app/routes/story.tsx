import type {
    ActionFunctionArgs, LoaderFunctionArgs
} from "@remix-run/node";

import { redirect } from "@remix-run/node";
import { createEmptyStory } from "../data";
import invariant from "tiny-invariant";
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
  import { getStories } from "../data";

export const loader = async ({
}: LoaderFunctionArgs) => {
  const stories = await getStories();
  return json({ stories });
};

export const action = async () => {
    const story = await createEmptyStory();
    return redirect(`/story/${story.id}`);
  };

  export default function Story() {
    const { stories } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
  
    return (
    <div className="flex">
      <div id="sidebar">
      <h1><Link to="/">gpt if</Link></h1>
      <div>
        <Form method="post" action="stories">
          <button type="submit">New Story</button>
        </Form>
      </div>
      <nav>
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
                  to={`${story.id}`}
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
      </nav>
      </div>
    <Outlet />

    </div>  );
  }
  