import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, AlertTriangle, Clock, Users, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for demonstration - will be replaced with real data once types are regenerated
const performanceData = [
  { time: '00:00', responseTime: 120, throughput: 450 },
  { time: '04:00', responseTime: 110, throughput: 380 },
  { time: '08:00', responseTime: 180, throughput: 820 },
  { time: '12:00', responseTime: 210, throughput: 950 },
  { time: '16:00', responseTime: 190, throughput: 880 },
  { time: '20:00', responseTime: 140, throughput: 620 },
];

const eventTypeData = [
  { name: 'User Actions', value: 1250, color: 'hsl(var(--chart-1))' },
  { name: 'API Calls', value: 890, color: 'hsl(var(--chart-2))' },
  { name: 'Page Views', value: 2340, color: 'hsl(var(--chart-3))' },
  { name: 'System Events', value: 450, color: 'hsl(var(--chart-4))' },
];

const errorTrendData = [
  { date: 'Mon', count: 12, severity: 8 },
  { date: 'Tue', count: 8, severity: 5 },
  { date: 'Wed', count: 15, severity: 11 },
  { date: 'Thu', count: 6, severity: 4 },
  { date: 'Fri', count: 10, severity: 7 },
  { date: 'Sat', count: 4, severity: 2 },
  { date: 'Sun', count: 5, severity: 3 },
];

const sessionData = [
  { hour: '00:00', active: 45, new: 12 },
  { hour: '04:00', active: 23, new: 5 },
  { hour: '08:00', active: 156, new: 34 },
  { hour: '12:00', active: 234, new: 56 },
  { hour: '16:00', active: 198, new: 42 },
  { hour: '20:00', active: 123, new: 28 },
];

export default function AdminTelemetry() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemetry & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring and performance analytics across the platform
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24,583</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156ms</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-8.2%</span> improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+23</span> in last 5 min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.34%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.12%</span> from baseline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend</CardTitle>
                  <CardDescription>Average API response time over the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="responseTime" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorResponse)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request Throughput</CardTitle>
                  <CardDescription>Requests per minute across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="throughput" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution</CardTitle>
                  <CardDescription>Breakdown of event types in the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={eventTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {eventTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Events</CardTitle>
                  <CardDescription>Most frequent user actions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Document Upload', count: 456, trend: '+12%' },
                      { action: 'Project View', count: 389, trend: '+8%' },
                      { action: 'RFI Creation', count: 234, trend: '-3%' },
                      { action: 'Team Invitation', count: 187, trend: '+15%' },
                      { action: 'Tender Submission', count: 156, trend: '+22%' },
                    ].map((event, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.action}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{event.count} events</span>
                          <span className={`text-sm font-medium ${event.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {event.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Activity</CardTitle>
                <CardDescription>Active and new user sessions throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="hsl(var(--chart-1))" name="Active Sessions" />
                    <Bar dataKey="new" fill="hsl(var(--chart-2))" name="New Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Error Trends</CardTitle>
                  <CardDescription>Error count and severity over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={errorTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(var(--chart-3))" name="Total Errors" />
                      <Bar dataKey="severity" fill="hsl(var(--destructive))" name="Critical Errors" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>Latest system errors and exceptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: 'Network Error', message: 'Failed to fetch project data', time: '2 min ago', severity: 'high' },
                      { type: 'Validation Error', message: 'Invalid date format in RFI form', time: '15 min ago', severity: 'medium' },
                      { type: 'Auth Error', message: 'Token refresh failed', time: '32 min ago', severity: 'high' },
                      { type: 'Parse Error', message: 'Unable to parse Excel file', time: '1 hour ago', severity: 'low' },
                    ].map((error, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          error.severity === 'high' ? 'text-red-500' : 
                          error.severity === 'medium' ? 'text-yellow-500' : 
                          'text-blue-500'
                        }`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{error.type}</span>
                            <span className="text-xs text-muted-foreground">{error.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{error.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
