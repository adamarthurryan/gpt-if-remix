import type {
    ActionFunctionArgs,
} from "@remix-run/node";
import { 
  Form,
  Link,
  Outlet,
  NavLink,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

import { redirect, json } from "@remix-run/node";
import { getPages } from "../data";
import invariant from "tiny-invariant";
  
//get pages in loader
export const loader = async ({
    params,
  }: LoaderFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    const pages = await getPages(params.storyId);
    return json({ pages });
  };

export const action = async ({
    params,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");

    const story = await getStory(params.storyId);
    if (!story) {
      throw new Response("Not Found", { status: 404 });
    }

    const page = await createEmptyPage(params.storyId, story?.rootPageId);
    return redirect(`/story/${story.id}/page/${page.id}`);
  };

  export default function Pages() {
    const { pages } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
  
    return (
      <div className="flex">
        <div id="sidebar">
        <h1><Link to="/">gpt if</Link></h1>
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
                    to={`${page.id}`}
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
      </div>
      <Outlet />

    </div>
    );
  }
  