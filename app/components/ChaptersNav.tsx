import type { StoryRecord, ChapterRecord } from "../data";

import { 
    Link,
    Outlet,
    NavLink
} from "@remix-run/react";
  
export default function ChaptersNav({story, chapters}) {
  console.log(story);
    return (
        <nav>
            <ul>          
              <li>
                <Link to={`/story/${story.id}/page/${story.rootPageId}`}>Start</Link>
              </li>
  
              {chapters.filter(chapter => chapter.pageId != story.rootPageId).map((chapter) => (
                <li key={chapter.pageId}>
                  <NavLink
                    className={({ isActive, isPending }) =>
                      isActive
                        ? "active"
                        : isPending
                        ? "pending"
                        : ""
                    }
                    to={`/story/${story.id}/page/${chapter.pageId}`}
                  >
                    {chapter.title ? (
                      <>
                        {chapter.title}
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
