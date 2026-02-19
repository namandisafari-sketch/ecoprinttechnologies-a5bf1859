import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  District,
  Subcounty,
  fetchDistricts,
  fetchSubcountiesForDistrict,
} from "@/lib/ugandaLocations";
import { Loader2 } from "lucide-react";

export interface LocationData {
  district: string;
  subcounty: string;
  parish: string;
  village: string;
}

interface Props {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

const UgandaLocationSelector = ({ value, onChange }: Props) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [subcounties, setSubcounties] = useState<Subcounty[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingSubcounties, setLoadingSubcounties] = useState(false);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<
    number | null
  >(null);

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .finally(() => setLoadingDistricts(false));
  }, []);

  const handleDistrictChange = async (districtName: string) => {
    const district = districts.find((d) => d.district_name === districtName);
    onChange({ district: districtName, subcounty: "", parish: "", village: "" });
    setSubcounties([]);

    if (district) {
      setSelectedDistrictCode(district.district_code);
      setLoadingSubcounties(true);
      const subs = await fetchSubcountiesForDistrict(district.district_code);
      setSubcounties(subs);
      setLoadingSubcounties(false);
    }
  };

  const handleSubcountyChange = (subcounty: string) => {
    onChange({ ...value, subcounty, parish: "", village: "" });
  };

  return (
    <div className="space-y-3">
      {/* District */}
      <div className="space-y-1">
        <Label className="text-xs">
          District <span className="text-destructive">*</span>
        </Label>
        {loadingDistricts ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground h-10">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading districts…
          </div>
        ) : (
          <Select value={value.district} onValueChange={handleDistrictChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {districts.map((d) => (
                <SelectItem key={d.district_code} value={d.district_name}>
                  {d.district_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sub-county */}
      <div className="space-y-1">
        <Label className="text-xs">
          Sub-county / Division <span className="text-destructive">*</span>
        </Label>
        {loadingSubcounties ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground h-10">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading sub-counties…
          </div>
        ) : (
          <Select
            value={value.subcounty}
            onValueChange={handleSubcountyChange}
            disabled={!value.district || subcounties.length === 0}
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={
                  value.district ? "Select sub-county" : "Select district first"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {subcounties.map((s) => (
                <SelectItem key={s.subcounty_code} value={s.subcounty_name}>
                  {s.subcounty_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Parish — free text */}
      <div className="space-y-1">
        <Label className="text-xs">Parish</Label>
        <Input
          value={value.parish}
          onChange={(e) => onChange({ ...value, parish: e.target.value })}
          placeholder="Parish name"
          className="h-10"
        />
      </div>

      {/* Village — free text */}
      <div className="space-y-1">
        <Label className="text-xs">Village</Label>
        <Input
          value={value.village}
          onChange={(e) => onChange({ ...value, village: e.target.value })}
          placeholder="Village name"
          className="h-10"
        />
      </div>
    </div>
  );
};

export default UgandaLocationSelector;
