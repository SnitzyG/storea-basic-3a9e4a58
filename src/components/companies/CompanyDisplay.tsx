import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Clock } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  user_count: number;
  users: {
    name: string;
    role: string;
  }[];
}

export const CompanyDisplay = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // Fetch companies with user counts
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          address,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      if (companiesData) {
        // For each company, fetch associated users
        const companiesWithUsers = await Promise.all(
          companiesData.map(async (company) => {
            const { data: users, error: usersError } = await supabase
              .from('profiles')
              .select('name, role')
              .eq('company_id', company.id);

            if (usersError) {
              console.warn('Error fetching users for company:', usersError);
            }

            return {
              ...company,
              user_count: users?.length || 0,
              users: users || []
            };
          })
        );

        setCompanies(companiesWithUsers);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading companies...</div>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No companies have been created yet.</p>
            <p className="text-sm mt-2">Companies will be automatically created when users sign up with company information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Companies ({companies.length})</h2>
      </div>
      
      {companies.map((company) => (
        <Card key={company.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {company.name}
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {company.user_count} {company.user_count === 1 ? 'user' : 'users'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.address && (
              <p className="text-sm text-muted-foreground">{company.address}</p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Created {new Date(company.created_at).toLocaleDateString()}
            </div>

            {company.users.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Team Members:</h4>
                <div className="flex flex-wrap gap-2">
                  {company.users.map((user, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs bg-muted px-2 py-1 rounded">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};