import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, FileX, CheckCircle2, Clock } from 'lucide-react';

interface TenderDocument {
  id: number;
  name: string;
  status: 'complete' | 'pending';
  hasFile: boolean;
  notes: string;
  isConditional?: boolean;
  completed: boolean;
}

export function TenderPackageTracker() {
  const [documents, setDocuments] = useState<TenderDocument[]>([
    { id: 1, name: 'Notice to Tenderers', status: 'complete', hasFile: true, notes: 'Received from architect on Oct 15', completed: true },
    { id: 2, name: 'Conditions of Tendering', status: 'pending', hasFile: false, notes: 'Waiting for architect confirmation', completed: false },
    { id: 3, name: 'General Conditions of Contract', status: 'pending', hasFile: false, notes: '', completed: false },
    { id: 4, name: 'Contract Schedules', status: 'complete', hasFile: true, notes: 'All schedules provided and reviewed', completed: true },
    { id: 5, name: 'Tender Form', status: 'pending', hasFile: false, notes: 'Standard form template expected', completed: false },
    { id: 6, name: 'Schedules of Monetary Sums', status: 'pending', hasFile: false, notes: 'Required if project includes cost items', completed: false, isConditional: true },
    { id: 7, name: 'Tender Schedules', status: 'pending', hasFile: false, notes: '', completed: false },
    { id: 8, name: 'Technical Specifications', status: 'complete', hasFile: true, notes: 'Main specs + specialist consultant details included', completed: true },
    { id: 9, name: 'Technical Schedules', status: 'pending', hasFile: false, notes: 'Doors, hardware, electrical fittings schedules', completed: false },
    { id: 10, name: 'Drawings', status: 'pending', hasFile: false, notes: 'Waiting for final issue drawings from architect', completed: false },
    { id: 11, name: 'Bills of Quantities', status: 'pending', hasFile: false, notes: 'Required if applicable to contract type', completed: false, isConditional: true },
  ]);

  const completedCount = documents.filter(doc => doc.completed).length;
  const totalCount = documents.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const toggleDocument = (id: number) => {
    setDocuments(docs =>
      docs.map(doc =>
        doc.id === id
          ? { ...doc, completed: !doc.completed, status: !doc.completed ? 'complete' : 'pending' }
          : doc
      )
    );
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Tender Package Tracker</CardTitle>
            <CardDescription className="mt-2">
              Manage documents received from your architect
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress Section */}
        <div className="bg-muted/30 rounded-lg p-6 mb-6 border border-border/40">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground">
              Progress: {completedCount} of {totalCount} items completed
            </span>
            <span className="font-semibold text-primary">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Documents Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12 text-center">✓</TableHead>
                <TableHead className="w-16">Item</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-20 text-center">File</TableHead>
                <TableHead className="w-64">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/20">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={doc.completed}
                      onCheckedChange={() => toggleDocument(doc.id)}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{doc.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.name}</span>
                      {doc.isConditional && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Conditional
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.status === 'complete' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.hasFile ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-green-100 text-green-700">
                        <FileText className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-muted text-muted-foreground">
                        <FileX className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/40">
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Completed
              </p>
              <p className="text-4xl font-bold text-primary">{completedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Remaining
              </p>
              <p className="text-4xl font-bold text-primary">{totalCount - completedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Overall Progress
              </p>
              <p className="text-4xl font-bold text-primary">{progressPercentage}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <Button className="w-full mt-6" size="lg">
          Submit Tender Package
        </Button>
      </CardContent>
    </Card>
  );
}
