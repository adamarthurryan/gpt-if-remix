import type {
    ActionFunctionArgs,
} from "@remix-run/node";

import { redirect } from "@remix-run/node";
import { createEmptyStory } from "../data";
import invariant from "tiny-invariant";
  

export const action = async () => {
    const story = await createEmptyStory();
    return redirect(`/story/${story.id}`);
  };