import type { StoryRecord, PageRecord } from "../data";


export default function StoryView({story, ancestors, currentText, currentPrompt}) {
    return (
        <div>
            <h1>{story.title}</h1>
            {
                ancestors.map((page) => {
                    return (
                        <div key={page.id}>
                            <h4>{page.prompt}</h4>
                            {page.text ? <PageView text={page.text}/> : <p></p>}
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
                lines.map((line) => <p key={line.slice(0,15)}>{line}</p>)
            }
        </div>
    );  
}