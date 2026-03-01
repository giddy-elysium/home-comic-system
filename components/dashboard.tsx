"use client";

import { useEffect, useMemo, useState } from "react";

import type { CatalogSeries } from "../lib/catalog";

type IssueStatus = "owned" | "wanted";
type CollectionState = Record<string, Record<number, IssueStatus>>;

type DashboardProps = {
  series: CatalogSeries[];
};

const storageKey = "back-issue-radar-collection-v1";

export function Dashboard({ series }: DashboardProps) {
  const [selectedSeriesId, setSelectedSeriesId] = useState(series[0]?.id ?? "");
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

  useEffect(() => {
    setSelectedIssueNumber(1);
  }, [selectedSeriesId]);

  const selectedSeries = useMemo(
    () => series.find((entry) => entry.id === selectedSeriesId) ?? series[0],
    [selectedSeriesId, series]
  );

  const selectedSeriesState = selectedSeries ? collectionState[selectedSeries.id] ?? {} : {};

  const selectedIssue = useMemo(() => {
    if (!selectedSeries) {
      return undefined;
    }

    return (
      selectedSeries.issues.find((issue) => issue.issueNumber === selectedIssueNumber) ?? selectedSeries.issues[0]
    );
  }, [selectedIssueNumber, selectedSeries]);

  const totalIssues = series.reduce((sum, entry) => sum + entry.issueCount, 0);
  const totalOwned = Object.values(collectionState).reduce(
    (sum, entry) => sum + Object.values(entry).filter((value) => value === "owned").length,
    0
  );
  const totalWanted = Object.values(collectionState).reduce(
    (sum, entry) => sum + Object.values(entry).filter((value) => value === "wanted").length,
    0
  );
  const selectedOwned = Object.values(selectedSeriesState).filter((value) => value === "owned").length;
  const selectedWanted = Object.values(selectedSeriesState).filter((value) => value === "wanted").length;
  const selectedMissing = selectedSeries ? selectedSeries.issueCount - selectedOwned : 0;
  const progress = selectedSeries ? Math.round((selectedOwned / selectedSeries.issueCount) * 100) : 0;

  function setStatus(seriesId: string, issueNumber: number, status?: IssueStatus) {
    setCollectionState((current) => {
      const nextSeriesState = { ...(current[seriesId] ?? {}) };

      if (!status) {
        delete nextSeriesState[issueNumber];
      } else {
        nextSeriesState[issueNumber] = status;
      }

      return {
        ...current,
        [seriesId]: nextSeriesState
      };
    });
  }

  if (!selectedSeries || !selectedIssue) {
    return null;
  }

  return (
    <main className="portalShell">
      <section className="portalFrame">
        <header className="topBar">
          <div>
            <p className="topLabel">Collection Console</p>
            <h1>Back Issue Radar</h1>
            <p className="topCopy">Developer-portal style planning board for cover runs, gaps, and future buying flows.</p>
          </div>
          <div className="topStats">
            <article className="statCard">
              <span>Series loaded</span>
              <strong>{series.length}</strong>
            </article>
            <article className="statCard">
              <span>Total issues</span>
              <strong>{totalIssues}</strong>
            </article>
            <article className="statCard">
              <span>Owned</span>
              <strong>{totalOwned}</strong>
            </article>
            <article className="statCard">
              <span>Wanted</span>
              <strong>{totalWanted}</strong>
            </article>
          </div>
        </header>

        <div className="workspaceShell">
          <aside className="panel panelSeriesRail">
            <div className="panelSection">
              <p className="sectionLabel">Series registry</p>
              <h2>Active shelves</h2>
              <p className="seriesCopy">
                The shell stays fixed. You swap series on the left, inspect the selected issue in the center, and work
                the full cover wall on the right.
              </p>
            </div>

            <div className="seriesList">
              {series.map((entry) => {
                const entryState = collectionState[entry.id] ?? {};
                const ownedCount = Object.values(entryState).filter((value) => value === "owned").length;
                const wantedCount = Object.values(entryState).filter((value) => value === "wanted").length;

                return (
                  <button
                    className={`seriesCard ${entry.id === selectedSeries.id ? "active" : ""}`}
                    key={entry.id}
                    onClick={() => setSelectedSeriesId(entry.id)}
                    type="button"
                  >
                    <div>
                      <strong>{entry.title}</strong>
                      <span>
                        {entry.publisher} | {entry.rangeLabel}
                      </span>
                    </div>
                    <div className="seriesCardMeta">
                      <small>{entry.issueCount} issues</small>
                      <small>
                        {ownedCount} owned / {wantedCount} wanted
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="panel panelHero">
            <div className="heroHead">
              <div>
                <p className="sectionLabel">Selected run</p>
                <h2>{selectedSeries.title}</h2>
                <p className="seriesMeta">
                  {selectedSeries.publisher} | {selectedSeries.rangeLabel} | {selectedSeries.issueCount} issues
                </p>
              </div>
              <div className="heroBadges">
                <span className="wallCount">{selectedSeries.verifiedIssueCount} counted</span>
                <a className="externalButton" href={selectedIssue.issueUrl} target="_blank" rel="noreferrer">
                  Open issue ref
                </a>
              </div>
            </div>

            <div className="heroBody">
              <div className="coverStage">
                <img className="coverImage" src={selectedIssue.imageUrl} alt={selectedIssue.title} />
              </div>

              <div className="controlStage">
                <div className="detailCard">
                  <p className="detailLabel">Current issue</p>
                  <h3>
                    {selectedIssue.title}
                    <span>#{selectedIssue.issueNumber}</span>
                  </h3>
                  <p>{selectedIssue.releaseDate || selectedSeries.planningNote}</p>
                </div>

                <div className="panelSection progressPanel">
                  <div className="progressHeader">
                    <span>Run progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="progressBar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="progressStats">
                    <span>{selectedOwned} owned</span>
                    <span>{selectedMissing} open</span>
                    <span>{selectedWanted} wanted</span>
                  </div>
                </div>

                <div className="statusPills">
                  <span className={`statusPill ${selectedSeriesState[selectedIssue.issueNumber] === "owned" ? "owned" : ""}`}>
                    {selectedSeriesState[selectedIssue.issueNumber] === "owned" ? "Owned now" : "Not owned"}
                  </span>
                  <span className={`statusPill ${selectedSeriesState[selectedIssue.issueNumber] === "wanted" ? "wanted" : ""}`}>
                    {selectedSeriesState[selectedIssue.issueNumber] === "wanted" ? "On want list" : "Not on want list"}
                  </span>
                </div>

                <div className="actionGrid">
                  <button
                    className="actionButton owned"
                    onClick={() => setStatus(selectedSeries.id, selectedIssue.issueNumber, "owned")}
                    type="button"
                  >
                    Mark owned
                  </button>
                  <button
                    className="actionButton wanted"
                    onClick={() => setStatus(selectedSeries.id, selectedIssue.issueNumber, "wanted")}
                    type="button"
                  >
                    Mark wanted
                  </button>
                  <button
                    className="actionButton clear"
                    onClick={() => setStatus(selectedSeries.id, selectedIssue.issueNumber)}
                    type="button"
                  >
                    Clear state
                  </button>
                </div>

                <div className="detailCard noteCard">
                  <p className="detailLabel">Planning note</p>
                  <p>{selectedSeries.sourceNote}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel panelWall">
            <div className="wallHead">
              <div>
                <p className="sectionLabel">Issue wall</p>
                <h2>{selectedSeries.title}</h2>
              </div>
              <span className="wallCount">{selectedSeries.issueCount} cards</span>
            </div>

            <div className="coverWall">
              {selectedSeries.issues.map((issue) => {
                const status = selectedSeriesState[issue.issueNumber];

                return (
                  <button
                    className={`coverCard ${selectedIssue.issueNumber === issue.issueNumber ? "selected" : ""} ${status ?? "neutral"}`}
                    key={`${selectedSeries.id}-${issue.issueNumber}`}
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
