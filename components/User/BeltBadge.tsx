import { Badge } from "../ui/badge";
import { BeltRanks, BELTS } from "@/constants/belts";

const BeltBadge = ({ belt }: { belt: string }) => {
  const beltValue = BeltRanks.find((b) => b.key === belt)?.value || "Unknown Belt";
  const beltColor = BELTS.find((b) => b.key === belt)?.color || "Unknown Belt";
  return (
    <>
      <Badge
        variant={"outline"}
        className={`${beltColor} text-[10px] capitalize tracking-wider`}
      >
        {beltValue}
      </Badge>
    </>
  );
};

export default BeltBadge;
