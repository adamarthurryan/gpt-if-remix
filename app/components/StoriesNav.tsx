import type { StoryRecord } from "../data";

import { 
    Link,
    Outlet,
    NavLink
} from "@remix-run/react";
  
export default function StoriesNav({stories}) {
  return (

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
            to={`/story/${story.id}`}
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
  );
}
