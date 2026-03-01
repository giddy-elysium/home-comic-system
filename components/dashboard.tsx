"use client";

import { useEffect, useMemo, useState } from "react";

type Issue = {
  issueNumber: number;
  title: string;
  releaseDate: string;
  imageUrl: string;
  issueUrl: string;
};

type CollectionState = Record<number, "owned" | "wanted">;

type DashboardProps = {
  issues: Issue[];
};

const storageKey = "panel-vault-new-mutants";

export function Dashboard({ issues }: DashboardProps) {
  const [selectedIssueNumber, setSelectedIssueNumber] = useState(1);
  const [collectionState, setCollectionState] = useState<CollectionState>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      setCollectionState(JSON.parse(saved) as CollectionState);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(collectionState));
  }, [collectionState]);

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.issueNumber === selectedIssueNumber) ?? issues[0],
    [issues, selectedIssueNumber]
  );

  const ownedCount = Object.values(collectionState).filter((value) => value === "owned").length;
  const wantedCount = Object.values(collectionState).filter((value) => value === "wanted").length;
  const missingCount = issues.length - ownedCount;
  const progress = Math.round((ownedCount / issues.length) * 100);

  function setStatus(issueNumber: number, status?: "owned" | "wanted") {
    setCollectionState((current) => {
      const next = { ...current };

      if (!status) {
        delete next[issueNumber];
        return next;
      }

      next[issueNumber] = status;
      return next;
    });
  }

  return (
    <main className="portalShell">
      <section className="portalFrame">
        <header className="topBar">
          <div>
            <p className="topLabel">Collection Console</p>
            <h1>Back Issue Radar</h1>
          </div>
          <div className="topStats">
            <article className="statCard">
              <span>Run</span>
              <strong>33 issues</strong>
            </article>
            <article className="statCard">
              <span>Owned</span>
              <strong>{ownedCount}</strong>
            </article>
            <article className="statCard">
              <span>Need</span>
              <strong>{missingCount}</strong>
            </article>
            <article className="statCard">
              <span>Want list</span>
              <strong>{wantedCount}</strong>
            </article>
          </div>
        </header>

        <div className="workspaceShell">
          <aside className="panel panelSide">
            <div className="panelSection">
              <p className="sectionLabel">Series</p>
              <h2>New Mutants</h2>
              <p className="seriesMeta">Marvel | 2019-2022 | 33 primary covers</p>
              <p className="seriesCopy">
                One-screen collection tracker for the full run. Select a cover, mark it as owned or wanted, and keep
                the entire wall visible without scrolling the page.
              </p>
            </div>

            <div className="panelSection progressPanel">
              <div className="progressHeader">
                <span>Collection progress</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progressBar">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="panelSection">
              <p className="sectionLabel">Legend</p>
              <div className="legendList">
                <span className="legendItem owned">Owned</span>
                <span className="legendItem wanted">Wanted</span>
                <span className="legendItem neutral">Unmarked</span>
              </div>
            </div>

            <div className="panelSection issueMiniList">
              {issues.map((issue) => (
                <button
                  className={`issueMini ${selectedIssue.issueNumber === issue.issueNumber ? "active" : ""}`}
                  key={issue.issueNumber}
                  onClick={() => setSelectedIssueNumber(issue.issueNumber)}
                  type="button"
                >
                  <span>#{issue.issueNumber}</span>
                  <small>{collectionState[issue.issueNumber] ?? "clear"}</small>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel panelHero">
            <div className="heroHead">
              <div>
                <p className="sectionLabel">Selected issue</p>
                <h2>{selectedIssue.title}</h2>
                <p className="seriesMeta">{selectedIssue.releaseDate || "Official Marvel primary cover"}</p>
              </div>
              <a className="externalButton" href={selectedIssue.issueUrl} target="_blank" rel="noreferrer">
                Open Marvel
              </a>
            </div>

            <div className="heroBody">
              <div className="coverStage">
                <img className="coverImage" src={selectedIssue.imageUrl} alt={selectedIssue.title} />
              </div>

              <div className="controlStage">
                <div className="statusPills">
                  <span className={`statusPill ${collectionState[selectedIssue.issueNumber] === "owned" ? "owned" : ""}`}>
                    {collectionState[selectedIssue.issueNumber] === "owned" ? "Owned now" : "Not owned"}
                  </span>
                  <span className={`statusPill ${collectionState[selectedIssue.issueNumber] === "wanted" ? "wanted" : ""}`}>
                    {collectionState[selectedIssue.issueNumber] === "wanted" ? "On want list" : "Not on want list"}
                  </span>
                </div>

                <div className="actionGrid">
                  <button className="actionButton owned" onClick={() => setStatus(selectedIssue.issueNumber, "owned")} type="button">
                    Mark Owned
                  </button>
                  <button className="actionButton wanted" onClick={() => setStatus(selectedIssue.issueNumber, "wanted")} type="button">
                    Mark Wanted
                  </button>
                  <button className="actionButton clear" onClick={() => setStatus(selectedIssue.issueNumber)} type="button">
                    Clear
                  </button>
                </div>

                <div className="detailCard">
                  <p className="detailLabel">Issue status</p>
                  <h3>
                    #{selectedIssue.issueNumber}{" "}
                    <span>{collectionState[selectedIssue.issueNumber] ? collectionState[selectedIssue.issueNumber] : "unmarked"}</span>
                  </h3>
                  <p>
                    Use the cover wall on the right to move quickly across the run. The current selection stays pinned
                    here so the experience feels more like a portal than a long page.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel panelWall">
            <div className="wallHead">
              <div>
                <p className="sectionLabel">Cover wall</p>
                <h2>Primary Covers</h2>
              </div>
              <span className="wallCount">{issues.length} cards</span>
            </div>

            <div className="coverWall">
              {issues.map((issue) => {
                const status = collectionState[issue.issueNumber];

                return (
                  <button
                    className={`coverCard ${selectedIssue.issueNumber === issue.issueNumber ? "selected" : ""} ${status ?? "neutral"}`}
                    key={issue.issueNumber}
                    onClick={() => setSelectedIssueNumber(issue.issueNumber)}
                    type="button"
                  >
                    <img src={issue.imageUrl} alt={issue.title} />
                    <div className="coverMeta">
                      <strong>#{issue.issueNumber}</strong>
                      <span>{status ?? "unmarked"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
