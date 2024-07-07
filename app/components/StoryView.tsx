import type { StoryRecord, PageRecord } from "../data";


export default function StoryView({story, ancestors, currentText, currentPrompt}) {
    console.log(story,ancestors)
    return (
        <div>
            <h1>{story.title}</h1>
            {
                ancestors.map((page) => {
                    return (
                        <div>
                        <div>
                            <h4>{page.prompt}</h4>
                            {page.text ? <PageView text={page.text}/> : <p></p>}
                        </div>
                        </div>
                    );
                })
            }
        </div>
    );  
}

function PageView({text}) {
    let lines = text.split("\n");
    return (
        <div>
            {
                lines.map((line) => <p>{line}</p>)
            }
        </div>
    );  
}