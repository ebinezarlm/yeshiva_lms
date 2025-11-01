import { Users, CreditCard, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  status: string;
  amountPaid: string;
  dueDate: string;
}

interface DashboardCardsProps {
  users: User[];
}

export function DashboardCards({ users }: DashboardCardsProps) {
  const totalUsers = users.length;
  const activeSubscriptions = users.filter(u => u.status === "Active").length;
  
  const totalRevenue = users.reduce((sum, user) => {
    const amount = parseInt(user.amountPaid.replace(/[^0-9]/g, ""));
    return sum + amount;
  }, 0);
  
  const expiringSoon = users.filter(u => {
    if (u.status !== "Active") return false;
    const dueDate = new Date(u.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30 && daysUntilDue > 0;
  }).length;

  const cards = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      description: "Registered users",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
      testId: "card-total-users"
    },
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.toString(),
      icon: CreditCard,
      description: "Currently active",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
      testId: "card-active-subscriptions"
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "All time earnings",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
      testId: "card-total-revenue"
    },
    {
      title: "Expiring Soon",
      value: expiringSoon.toString(),
      icon: Clock,
      description: "Next 30 days",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950",
      testId: "card-expiring-soon"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} data-testid={card.testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-${card.testId}-value`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
