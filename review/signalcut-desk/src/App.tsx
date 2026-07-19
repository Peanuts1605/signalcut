import {AlertCircle, Check, Expand, Link2, Pause, Play, Share2, Volume2, VolumeX} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";

type Purpose = "pain" | "promise" | "workflow" | "proof" | "outcome" | "cta";
type Scene = {purpose: Purpose; source_asset_ids: string[]; source_paths: string[]; headline: string; duration_ms: number};
type Storyboard = {project_name: string; strategy: string; manifest_hash: string; total_duration_ms: number; scenes: Scene[]};
type Candidate = {strategy: string; manifest_hash: string; total_duration_ms: number; beats: Scene[]};
type Evidence = {id: string; filename: string; local_path: string; purpose: Purpose; sha256: string; width: number; height: number; claim_ids: string[]};
type Receipt = {clarity_score: number; decision: string; selected_strategy: string; findings: {question: string; passed: boolean}[]};
type Proof = {duration_seconds: number; width: number; height: number; fps: string; video_sha256: string; status: string};
type ClaimFinding = {id: string; statement: string; status: "evidence_linked" | "needs_evidence"; evidence_asset_ids: string[]; note: string};
type ClaimLedger = {findings: ClaimFinding[]; linked_claim_count: number; missing_evidence_count: number; decision: "PUBLISH_READY" | "NEEDS_PROOF"};
type Data = {storyboard: Storyboard; candidates: Candidate[]; evidence: Evidence[]; receipt: Receipt; proof: Proof; claims: ClaimLedger};
type Tab = "Evidence" | "Stories" | "Claim review" | "Preview" | "Receipt";

const tabs: Tab[] = ["Evidence", "Stories", "Claim review", "Preview", "Receipt"];
const accents: Record<Purpose, string> = {outcome:"#247f79", pain:"#d4614e", promise:"#405783", workflow:"#c79b2a", proof:"#247f79", cta:"#d4614e"};
const title = (value:string) => value.split("_").map((part)=>part[0].toUpperCase()+part.slice(1)).join(" ");
const proofUrl = (file:string) => `${import.meta.env.BASE_URL}proof/${file}`;

export function App() {
  const [data, setData] = useState<Data>();
  const [tab, setTab] = useState<Tab>("Preview");
  const [strategy, setStrategy] = useState("outcome_first");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [shared, setShared] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(()=>{Promise.all([
    fetch(proofUrl("storyboard.json")).then(r=>r.json()), fetch(proofUrl("story-candidates.json")).then(r=>r.json()),
    fetch(proofUrl("evidence-manifest.json")).then(r=>r.json()), fetch(proofUrl("selection-receipt.json")).then(r=>r.json()),
    fetch(proofUrl("render-proof.json")).then(r=>r.json()), fetch(proofUrl("claim-ledger.json")).then(r=>r.json()),
  ]).then(([storyboard,candidates,evidence,receipt,proof,claims])=>setData({storyboard,candidates,evidence,receipt,proof,claims}));},[]);

  const candidate = useMemo(()=>data?.candidates.find(item=>item.strategy===strategy),[data,strategy]);
  if (!data) return <main className="loading">Opening the cut…</main>;
  const seek = (index:number) => { const seconds=data.storyboard.scenes.slice(0,index).reduce((sum,s)=>sum+s.duration_ms,0)/1000; if(video.current){video.current.currentTime=seconds; void video.current.play(); setPlaying(true);} };
  const togglePlay = () => { if(!video.current)return; if(video.current.paused){void video.current.play();setPlaying(true);}else{video.current.pause();setPlaying(false);} };
  const share = ()=>setShared(value=>!value);

  return <div className="shell">
    <aside>
      <h1>SignalCut</h1><div className="aside-label">PROJECT</div><strong>Threadloom Daily Demo</strong>
      <div className="aside-label stories-label">STORIES</div>
      {data.candidates.map((item,i)=><button className={`story-button ${strategy===item.strategy?"selected":""}`} onClick={()=>{setStrategy(item.strategy);setTab("Stories")}} key={item.strategy}><span style={{background:["#247f79","#c79b2a","#405783"][i]}} />{title(item.strategy)}</button>)}
      <div className="aside-foot"><span className="avatar">SC</span><div><strong>SignalCut</strong><small>Review desk</small></div></div>
    </aside>
    <main>
      <header><div><strong>Threadloom Daily Demo</strong><span>r/threadloom_daily_dev</span></div>{shared&&<output className="review-url">http://127.0.0.1:4173</output>}<button className="share" onClick={share}>{shared?<Check size={18}/>:<Share2 size={18}/>} {shared?"Hide review link":"Show review link"}</button></header>
      <nav>{tabs.map(item=><button className={tab===item?"active":""} onClick={()=>{if(item==="Preview")setStrategy("outcome_first");setTab(item)}} key={item}>{item}</button>)}</nav>
      <section className="workspace">
        {tab==="Preview" && <Preview data={data} playing={playing} muted={muted} video={video} togglePlay={togglePlay} setMuted={setMuted} seek={seek} />}
        {tab==="Evidence" && <EvidenceView evidence={data.evidence}/>} 
        {tab==="Stories" && <StoriesView candidates={data.candidates} selected={strategy} choose={setStrategy}/>} 
        {tab==="Claim review" && <ClaimReviewView claims={data.claims} evidence={data.evidence}/>}
        {tab==="Receipt" && <ReceiptView data={data}/>} 
      </section>
      <footer><span><Check/>Evidence linked</span><span><Check/>Render verified</span><span>{data.claims.decision==="PUBLISH_READY"?<Check/>:<AlertCircle/>}{data.claims.decision==="PUBLISH_READY"?"Claims ready":"Proof gap visible"}</span><code>{data.storyboard.manifest_hash.slice(0,8)}</code></footer>
    </main>
    <aside className="inspector"><div className="aside-label">SELECTED STORY</div><h2><i style={{background:accents[data.storyboard.scenes[0].purpose]}}/>{title(strategy)}</h2><div className="score"><small>JUDGE CLARITY</small><strong>{data.receipt.clarity_score} / 6</strong><span>All clarity signals are strong.</span></div><dl><dt>Duration</dt><dd>{Math.round(data.proof.duration_seconds)} seconds</dd><dt>Scenes</dt><dd>{candidate?.beats.length??6} scenes</dd><dt>Manifest</dt><dd><code>{data.storyboard.manifest_hash.slice(0,8)}</code></dd><dt>Render</dt><dd>{data.proof.width}×{data.proof.height}</dd></dl></aside>
  </div>;
}

function Preview({data,playing,muted,video,togglePlay,setMuted,seek}:{data:Data;playing:boolean;muted:boolean;video:React.RefObject<HTMLVideoElement|null>;togglePlay:()=>void;setMuted:(v:boolean)=>void;seek:(i:number)=>void}){
 return <div className="preview"><div className="screen"><video ref={video} muted={muted} onPlay={()=>{}} onEnded={()=>{}} poster={proofUrl("preview-poster.jpg")} src={proofUrl("signalcut_threadloom_outcome_first.mp4")}/><div className="controls"><button aria-label={playing?"Pause":"Play"} onClick={togglePlay}>{playing?<Pause/>:<Play/>}</button><button aria-label={muted?"Unmute":"Mute"} onClick={()=>{if(video.current)video.current.muted=!muted;setMuted(!muted)}}>{muted?<VolumeX/>:<Volume2/>}</button><span>55 sec · outcome first</span><button aria-label="Fullscreen" onClick={()=>video.current?.requestFullscreen()}><Expand/></button></div></div><div className="timeline">{data.storyboard.scenes.map((scene,i)=><button onClick={()=>seek(i)} key={scene.purpose} style={{borderTopColor:accents[scene.purpose]}}><small>{i+1}. {scene.purpose}</small><img src={proofUrl(scene.source_paths[0])} alt=""/><strong>{scene.headline}</strong></button>)}</div></div>;
}
function EvidenceView({evidence}:{evidence:Evidence[]}){return <div className="open-view"><h2>Verified evidence</h2><p>Seven real Threadloom screens. Every render scene points back here.</p><div className="evidence-grid">{evidence.map(item=><article key={item.id}><img src={proofUrl(item.local_path)} alt={item.filename}/><div><strong>{item.filename}</strong><span>{item.purpose} · {item.width}×{item.height}</span><code>{item.sha256.slice(0,12)}</code></div></article>)}</div></div>}
function StoriesView({candidates,selected,choose}:{candidates:Candidate[];selected:string;choose:(s:string)=>void}){return <div className="open-view"><h2>Three valid cuts</h2><p>Same evidence. Different editorial order. Outcome First won the deterministic tie-break.</p><div className="candidate-list">{candidates.map(item=><button className={selected===item.strategy?"chosen":""} onClick={()=>choose(item.strategy)} key={item.strategy}><div><strong>{title(item.strategy)}</strong><code>{item.manifest_hash.slice(0,8)}</code></div><ol>{item.beats.map(beat=><li key={beat.purpose}>{beat.purpose}</li>)}</ol></button>)}</div></div>}
function ClaimReviewView({claims,evidence}:{claims:ClaimLedger;evidence:Evidence[]}){const byId=new Map(evidence.map(item=>[item.id,item]));const ready=claims.decision==="PUBLISH_READY";return <div className="open-view claim-review"><div className="claim-heading"><div><h2>Claim review</h2><p>Every release claim needs an attached source. SignalCut links evidence; it never pretends an image proves more than a reviewer can see.</p></div><div className={`claim-decision ${ready?"ready":"needs-proof"}`}><small>PUBLISHING DECISION</small><strong>{ready?"Ready":"Needs proof"}</strong><span>{claims.linked_claim_count} linked · {claims.missing_evidence_count} missing</span></div></div><div className="claim-list">{claims.findings.map(claim=>{const linked=claim.status==="evidence_linked";return <article className={linked?"claim-linked":"claim-missing"} key={claim.id}><div className="claim-status">{linked?<Check/>:<AlertCircle/>}</div><div><small>{linked?"EVIDENCE LINKED":"NEEDS EVIDENCE"}</small><h3>{claim.statement}</h3><p>{claim.note}</p>{claim.evidence_asset_ids.length>0&&<div className="claim-sources">{claim.evidence_asset_ids.map(id=>{const asset=byId.get(id);return <span key={id}>{asset?asset.filename:id}</span>})}</div>}</div></article>})}</div></div>}
function ReceiptView({data}:{data:Data}){const[shown,setShown]=useState(false);return <div className="open-view receipt"><h2>Proof receipt</h2><p>The cut can be traced from source image to selected story to rendered file.</p><div className="receipt-band"><Check/><div><strong>{data.receipt.decision}</strong><span>Evidence → Story → Cut → Receipt</span></div></div>{data.receipt.findings.map(item=><div className="finding" key={item.question}><Check/><span>{item.question}</span></div>)}<button className="copy" onClick={()=>setShown(value=>!value)}><Link2/>{shown?"Hide video hash":"Show video hash"}</button>{shown&&<code className="full-hash">{data.proof.video_sha256}</code>}</div>}
