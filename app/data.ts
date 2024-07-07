const DEFAULT_SYSTEM_PROMPT = 
`You are a helpful writing assistant, helping me write a story. We will take turns writing a story\
 together. I will write a paragraph, and then you will write a paragraph. We will continue this way\
 until the story is complete. Your writing style is clear and concise, but imaginative and colourful.\
 If I wrap text in [brackets], it means that I am providing instructions for how the story will continue.\
 Please follow these instructions when writing your paragraph.
 The setting of the story is a medieval forest. The genre is fantasy. The main character is a skilled hunter.`;


////////////////////////////////////////////////////////////////////////////////
// a simple lowdb database pages and stories
// this only supports a single user - multiple sessions will overwrite one another
////////////////////////////////////////////////////////////////////////////////

import { JSONFilePreset } from "lowdb/node";
const db = await JSONFilePreset<Database>('db.json', { stories: {}, pages:{} })


// @ts-expect-error - no types, but it's a tiny function
import invariant from "tiny-invariant";
import sortBy from "sort-by";

type PageMutation = {
  prompt?: string;
  text?: string;
};

export type PageRecord = PageMutation & {
  id: string;
  createdAt: string;
  parentId?: string;
};

type StoryMutation = {
  title?: string;
  systemPrompt?: string;
};

export type StoryRecord = StoryMutation &{
  id: string;
  rootPageId: string;
  createdAt: string;
}

type Database = {
  stories: Record<string, StoryRecord>;
  pages: Record<string, Record<string, PageRecord>>;
}

////////////////////////////////////////////////////////////////////////////////
// This is just a fake DB table. In a real app you'd be talking to a real db or
// fetching from an existing API.
const pagesDb = {
  records: db.data.pages,// as Record<string, Record<string, PageRecord>>,

  
  async getAll(storyId:string): Promise<PageRecord[]> {
    const story = pagesDb.records[storyId];
    invariant(story, `No story found for ${storyId}`);

    return Object.keys(pagesDb.records[storyId])
      .map((key) => pagesDb.records[storyId][key])
      .sort(sortBy("-createdAt"));
  },

  async get(storyId:string, id: string): Promise<PageRecord | null> {
    const story = pagesDb.records[storyId];
    invariant(story, `No story found for ${storyId}`);

    return story[id] || null;
  },

  async getChildren(storyId:string, id: string): Promise<PageRecord[]> {
    const story = pagesDb.records[storyId];
    invariant(story, `No story found for ${storyId}`);

    return Object.values(story).filter((page) => page.parentId === id);
  },

  async create(storyId:string, parentId?:string, values?: PageMutation): Promise<PageRecord> {
    let story = pagesDb.records[storyId];
    if (!story) {
      pagesDb.records[storyId] = {};
      story = pagesDb.records[storyId];
    }

    const id = Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const newPage = { id, createdAt, parentId, ...values };
    story[id] = newPage;

    db.write();

    return newPage;
  },

  async set(storyId:string, id: string, values: PageMutation): Promise<PageRecord> {
    const page = await pagesDb.get(storyId, id);
    invariant(page, `No page found for ${id}`);

    const updatedPage = { ...page, ...values };
    pagesDb.records[storyId][id] = updatedPage;

    db.write();

    return updatedPage;
  },

  destroy(storyId:string, id: string): null {
    delete pagesDb.records[storyId][id];

    db.write();

    return null;
  },
};

const storiesDb = {
  records: db.data.stories as Record<string, StoryRecord>,

  async getAll(): Promise<StoryRecord[]> {
    return Object.keys(storiesDb.records)
      .map((key) => storiesDb.records[key])
      .sort(sortBy("-createdAt"));
  },

  async get(id: string): Promise<StoryRecord | null> {
    return storiesDb.records[id] || null;
  },

  async create(values: StoryMutation): Promise<StoryRecord> {
    const id = Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    
    const rootPage = await pagesDb.create(id);
    const rootPageId = rootPage.id;
    const newStory = { id, createdAt, rootPageId, ...values };

    storiesDb.records[id] = newStory;

    db.write();

    return newStory;
  },

  async set(id: string, values: StoryMutation): Promise<StoryRecord> {
    const story = await storiesDb.get(id);
    invariant(story, `No contact found for ${id}`);
    const updatedStory = { ...story, ...values };
    storiesDb.records[id] = updatedStory;

    db.write();

    return updatedStory;
  },

  destroy(id: string): null {
    delete storiesDb.records[id];
    
    //also delete associated pages
    Object.values(pagesDb.records).filter((page) => page.storyId === id).forEach((page) => {
      delete pagesDb.records[page.id];
    });

    db.write();
    return null;
  },
};


////////////////////////////////////////////////////////////////////////////////
// Handful of helper functions to be called from route loaders and actions
export async function getPages(storyId:string) {
  let pages = await pagesDb.getAll(storyId);
  
  return pages;//.sort(sortBy("last", "createdAt"));
}

export async function getPageChildren(storyId:string, id:string) {
  return pagesDb.getChildren(storyId, id);
}

export async function createEmptyPage(storyId:string, parentId:string) {
  const page = await pagesDb.create(storyId, parentId, {});
  return page;
}
export async function createPage(storyId:string, parentId:string, mutation: PageMutation) {
  const page = await pagesDb.create(storyId, parentId, mutation);
  return page;
}

export async function getPage(storyId:string, id: string) {
  return pagesDb.get(storyId, id);
}

export async function getPageAncestors(storyId: string, id: string) {
  let ancestors = [];
  let page = await pagesDb.get(storyId, id);
  if (!page) {
    throw new Error(`No page found for ${id}`);
  }

  while (page.parentId) {
    page = await pagesDb.get(storyId, page.parentId);
    if (!page) {
      throw new Error(`No page found for ${page.parentId}`);
    }
  
    ancestors.unshift(page);
  }
  return ancestors;
}

export async function updatePage(storyId:string, id: string, updates: PageMutation) {
  const page = await pagesDb.get(storyId, id);
  if (!page) {
    throw new Error(`No page found for ${id}`);
  }
  await pagesDb.set(storyId, id, { ...page, ...updates });
  return page;
}

export async function deletePage(storyId:string, id: string) {
  pagesDb.destroy(storyId, id);
}


export async function getStories() {
  let stories = await storiesDb.getAll();
  
  return stories;//.sort(sortBy("last", "createdAt"));
}

export async function createEmptyStory() {
  const story = await storiesDb.create({});
  return story;
}

export async function getStory(id: string) {
  return storiesDb.get(id);
}

export async function getRootPage(id: string) {
  const story = await storiesDb.get(id);
  if (!story) {
    throw new Error(`No story found for ${id}`);
  }

  return pagesDb.get(id, story.rootPageId);
}

export async function updateStory(id: string, updates: StoryMutation) {
  const story = await storiesDb.get(id);
  if (!story) {
    throw new Error(`No story found for ${id}`);
  }
  await storiesDb.set(id, { ...story, ...updates });
  return story;
}

export async function deleteStory(id: string) {
  storiesDb.destroy(id);
}

/*

const fakeStory0 = await storiesDb.create({title:"An adventure", systemPrompt:DEFAULT_SYSTEM_PROMPT});

//update root page
await updatePage(fakeStory0.id, fakeStory0.rootPageId, {prompt:"The adventure begins", text:""});

*/