import { Suspense } from "react";
import RosterEditor from "../../components/RosterEditor";

export default function RosterPage() {
  return (
    <Suspense fallback={null}>
      <RosterEditor />
    </Suspense>
  );
}
