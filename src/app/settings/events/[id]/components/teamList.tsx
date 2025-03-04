import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GroupAndSchedule } from "@/server/database";

interface Props {
    teamData?: GroupAndSchedule["data"];
    setTeamData: (teamData: GroupAndSchedule["data"]) => void;
    isEditing: boolean;
}

export default function TeamList({ teamData, setTeamData, isEditing }: Props) {
    const handleChange = (index: number, field: keyof GroupAndSchedule["data"][number], value: string) => {
        const updatedData = [...(teamData || [])];
        updatedData[index] = { ...updatedData[index], [field]: value };
        setTeamData(updatedData);
    };

    return (
        <div className="mt-4">
            {teamData && (teamData.length > 0) && (
                <>
                <Label className="font-medium text-gray-700">Teams</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {teamData.map((team, index) => (
                        <div 
                            key={team.id} 
                            className="p-4 border border-gray-300 rounded-lg space-y-2 bg-white shadow-sm"
                        >
                            <Label className="font-medium text-gray-700">Team {team.slot}</Label>
                            <Input 
                                value={team.team} 
                                disabled={!isEditing} 
                                onChange={(e) => handleChange(index, 'team', e.target.value)}
                                className="w-full"
                            />
                            <Input 
                                value={team.email} 
                                disabled={!isEditing} 
                                onChange={(e) => handleChange(index, 'email', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    ))}
                </div>
                </>
            )}
        </div>
    );
}
