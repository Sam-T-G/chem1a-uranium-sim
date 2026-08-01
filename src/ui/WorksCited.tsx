import { KIND_LABEL, SOURCES } from "../data/sources";
import { sci } from "./Sci";

/**
 * The full annotated bibliography, numbered to match the inline markers.
 * Every entry carries what it supports and, where relevant, what it does not.
 */
export default function WorksCited() {
	return (
		<ol className="works" role="list">
			{SOURCES.map((s, i) => (
				<li key={s.id} className="works-item" id={`source-${i + 1}`}>
					<span className="works-n">{i + 1}</span>
					<div className="works-body">
						<p className="works-title">
							<a href={s.url} target="_blank" rel="noreferrer noopener">
								{s.title} <span aria-hidden="true">↗</span>
							</a>
						</p>
						<p className="works-meta">
							{s.author} · {s.publisher} · {s.year}
							<span className="works-kind">{KIND_LABEL[s.kind]}</span>
						</p>
						<p className="works-note">{sci(s.note, s.id)}</p>
					</div>
				</li>
			))}
		</ol>
	);
}
