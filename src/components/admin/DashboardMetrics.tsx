import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Utensils, CheckCircle, BarChart3 } from "lucide-react";
import Image from 'next/image';

const metrics = [
  {
    title: "Total Attendees Today",
    value: "125",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
    img: "https://placehold.co/600x400.png",
    aiHint: "people eating",
  },
  {
    title: "Meals Served This Week",
    value: "876",
    icon: Utensils,
    color: "text-accent",
    bgColor: "bg-accent/10",
    img: "https://placehold.co/600x400.png",
    aiHint: "food buffet",
  },
  {
    title: "Peak Attendance Time",
    value: "12:30 PM",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    img: "https://placehold.co/600x400.png",
    aiHint: "clock lunch",
  },
  {
    title: "Attendance Rate",
    value: "85%",
    icon: BarChart3,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    img: "https://placehold.co/600x400.png",
    aiHint: "graph chart",
  },
];

export function DashboardMetrics() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {metrics.map((metric) => (
        <Card key={metric.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
          <div className="relative h-32 w-full">
            <Image 
              src={metric.img} 
              alt={metric.title} 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint={metric.aiHint}
            />
            <div className={`absolute inset-0 ${metric.bgColor} opacity-50`}></div>
             <div className={`absolute top-3 right-3 p-2 rounded-full ${metric.bgColor}`}>
              <metric.icon className={`h-6 w-6 ${metric.color}`} />
            </div>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${metric.color}`}>{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
