////////////////////////////////////////////////////////////////////////////////
// an in-memory database of pages
////////////////////////////////////////////////////////////////////////////////

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
  parentId: string;
};

type StoryMutation = {
  title?: string;
};

export type StoryRecord = StoryMutation &{
  id: string;
  rootPageId: string;
  createdAt: string;
}

////////////////////////////////////////////////////////////////////////////////
// This is just a fake DB table. In a real app you'd be talking to a real db or
// fetching from an existing API.
const pagesDb = {
  records: {} as Record<string, Record<string, PageRecord>>,

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

    console.log("GET", story);
    return story[id] || null;
  },

  async getChildren(storyId:string, id: string): Promise<PageRecord[]> {
    const story = pagesDb.records[storyId];
    invariant(story, `No story found for ${storyId}`);

    return Object.values(story).filter((page) => page.parentId === id);
  },

  async create(storyId:string, parentId:string, values: PageMutation): Promise<PageRecord> {
    let story = pagesDb.records[storyId];
    if (!story) {
      pagesDb.records[storyId] = {};
      story = pagesDb.records[storyId];
    }

    const id = Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const newPage = { id, createdAt, parentId, ...values };
    story[id] = newPage;
    return newPage;
  },

  async set(storyId:string, id: string, values: PageMutation): Promise<PageRecord> {
    const page = await pagesDb.get(storyId, id);
    invariant(page, `No page found for ${id}`);

    const updatedPage = { ...page, ...values };
    pagesDb.records[storyId][id] = updatedPage;
    return updatedPage;
  },

  destroy(storyId:string, id: string): null {
    delete pagesDb.records[storyId][id];
    return null;
  },
};

const storiesDb = {
  records: {} as Record<string, StoryRecord>,

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
    
    const rootPage = await pagesDb.create(id,null);
    const rootPageId = rootPage.id;
    const newStory = { id, createdAt, rootPageId, ...values };
    storiesDb.records[id] = newStory;
    return newStory;
  },

  async set(id: string, values: StoryMutation): Promise<StoryRecord> {
    const story = await storiesDb.get(id);
    invariant(story, `No contact found for ${id}`);
    const updatedStory = { ...story, ...values };
    storiesDb.records[id] = updatedStory;
    return updatedStory;
  },

  destroy(id: string): null {
    delete storiesDb.records[id];
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

export async function updatePage(storyId:string, id: string, updates: PageMutation) {
  const page = await pagesDb.get(storyId, id);
  if (!page) {
    throw new Error(`No story found for ${id}`);
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


const fakeStory0 = await storiesDb.create({title:"A sci fi adventure"});
const fakeStory1 = await storiesDb.create({title:"A fantasy adventure"});

//update root page
await updatePage(fakeStory0.id, fakeStory0.rootPageId, {prompt:"Root page", text:"the root page text"});

//create child pages
[
  {
    prompt:"Option A",
    text:"Just a test"
  },
  {
    prompt:"Option B",
    text:"Just a test"
  },
  {
    prompt:"Option C",
    text:"Just a test"
  },
].forEach((page) => {
  createPage(fakeStory0.id, fakeStory0.rootPageId, page);
});

console.log(storiesDb);
console.log(pagesDb);