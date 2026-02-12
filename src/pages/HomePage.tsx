import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';
import type { Project } from '@/lib/supabase-types';

// Import the monitor graphic
import monitorGraphic from '@/assets/monitor-graphic.png';

const automations = [
  { id: 'pl-conso', name: 'PL Conso Automation', path: '/automation/pl-conso' },
  { id: 'pl-input', name: 'PL Input Automation', path: '/automation/pl-input' },
  { id: 'pdp-conso', name: 'PDP Conso Automation', path: '/automation/pdp-conso' },
];

export function HomePage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedAutomation, setSelectedAutomation] = useState<string>('');
  const navigate = useNavigate();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Project[];
    },
  });

  const handleContinue = () => {
    if (selectedAutomation) {
      const automation = automations.find((a) => a.id === selectedAutomation);
      if (automation) {
        navigate(automation.path, { state: { projectId: selectedProject } });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      {/* Monitor graphic */}
      <div className="mb-8">
        <img
          src={monitorGraphic}
          alt="Platform Preview"
          className="max-w-2xl w-full h-auto"
          onError={(e) => {
            // Hide if image not found
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Welcome text */}
      <h1 className="text-4xl font-light text-foreground mb-12 italic">
        Welcome to Merkle Platform
      </h1>

      {/* Selectors */}
      <div className="w-full max-w-lg space-y-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full h-14 text-lg bg-background">
            <SelectValue placeholder="Select a Project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAutomation} onValueChange={setSelectedAutomation}>
          <SelectTrigger className="w-full h-14 text-lg bg-background">
            <SelectValue placeholder="Select an Automation" />
          </SelectTrigger>
          <SelectContent>
            {automations.map((automation) => (
              <SelectItem key={automation.id} value={automation.id}>
                {automation.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleContinue}
          disabled={!selectedProject || !selectedAutomation}
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
        >
          Continue
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export default HomePage;
