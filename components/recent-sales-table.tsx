import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Sale = {
  name: string;
  event: string;
  paymentMethod: string;
  amount: string;
  date: string;
  avatar?: string | null;
  initials?: string;
};

export function RecentSalesTable({ sales }: { sales: Sale[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          Latest ticket purchases from your attendees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={sale.avatar || '/placeholder.svg'}
                        alt={sale.name}
                      />
                      <AvatarFallback>
                        {sale.initials ??
                          sale.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{sale.name}</span>
                  </div>
                </TableCell>
                <TableCell>{sale.event}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sale.paymentMethod === 'BCH' ? 'default' : 'secondary'
                    }
                  >
                    {sale.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {sale.amount}
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-sm">
                  {sale.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
