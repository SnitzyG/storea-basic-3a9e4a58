import { PublicLayout } from '@/components/marketing/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Lightbulb, Users } from 'lucide-react';

const About = () => {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            About <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">StoreAli</span>
          </h1>
          
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            We're on a mission to revolutionize how construction projects are managed, making collaboration seamless and projects more successful.
          </p>

          <div className="prose prose-lg max-w-none mb-16 text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              StoreAli was born from the frustration of managing construction projects with outdated tools and fragmented communication. We recognized that the construction industry needed a modern, integrated platform that could keep pace with today's complex projects.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Our platform brings together document management, team collaboration, RFI tracking, financial oversight, and scheduling into one unified experience. We've designed every feature with real construction professionals in mind, ensuring that our tools actually solve the problems you face every day.
            </p>

            <p className="text-lg leading-relaxed">
              Today, teams around the world use StoreAli to deliver projects on time, within budget, and with better outcomes for everyone involved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-muted-foreground">
                  Empower construction teams with tools that make complex projects simple to manage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
                <p className="text-muted-foreground">
                  A world where every construction project is delivered efficiently and collaboratively.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Our Values</h3>
                <p className="text-muted-foreground">
                  Transparency, collaboration, and continuous improvement in everything we do.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;
