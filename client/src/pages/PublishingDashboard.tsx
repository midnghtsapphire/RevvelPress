import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, AlertCircle, Clock, FileText, Globe, BookOpen } from "lucide-react";
import { Streamdown } from "streamdown";

export default function PublishingDashboard() {
  const { user } = useAuth();
  const { data: papers, isLoading: papersLoading } = trpc.publishing.getUserPapers.useQuery();
  const { data: outlets, isLoading: outletsLoading } = trpc.publishing.getOutletMatches.useQuery(
    { paperId: papers?.[0]?.id || 0 },
    { enabled: !!papers?.[0]?.id }
  );

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Publishing Dashboard</h1>
          <p className="text-slate-400">Manage papers, track submissions, and generate citations</p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="papers" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="papers" className="text-slate-300 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Papers
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-slate-300 data-[state=active]:text-white">
              <Globe className="w-4 h-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="outlets" className="text-slate-300 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Outlets
            </TabsTrigger>
            <TabsTrigger value="citations" className="text-slate-300 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Citations
            </TabsTrigger>
          </TabsList>

          {/* Papers Tab */}
          <TabsContent value="papers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {papersLoading ? (
                <div className="col-span-2 text-center text-slate-400">Loading papers...</div>
              ) : papers && papers.length > 0 ? (
                papers.map((paper: any) => (
                  <Card key={paper.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{paper.title}</CardTitle>
                      <CardDescription className="text-slate-400">{paper.contentType}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 text-sm mb-4">{paper.abstract?.substring(0, 150)}...</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Publish
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center text-slate-400">No papers yet. Create one to get started.</div>
              )}
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Multi-Platform Submissions</CardTitle>
                <CardDescription className="text-slate-400">Track your paper submissions across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { platform: "Zenodo", status: "indexed", doi: "10.5281/zenodo.1234567" },
                    { platform: "SSRN", status: "submitted", doi: null },
                    { platform: "arXiv", status: "pending", doi: null },
                    { platform: "ResearchGate", status: "pending", doi: null },
                    { platform: "Academia.edu", status: "pending", doi: null },
                    { platform: "Google Scholar", status: "pending", doi: null },
                  ].map((item) => (
                    <div key={item.platform} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.status === "indexed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        {item.status === "submitted" && <Clock className="w-5 h-5 text-amber-500" />}
                        {item.status === "pending" && <AlertCircle className="w-5 h-5 text-slate-500" />}
                        <div>
                          <p className="text-white font-medium">{item.platform}</p>
                          {item.doi && <p className="text-slate-400 text-sm">DOI: {item.doi}</p>}
                        </div>
                      </div>
                      <Badge
                        className={
                          item.status === "indexed"
                            ? "bg-emerald-600"
                            : item.status === "submitted"
                              ? "bg-amber-600"
                              : "bg-slate-600"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outlets Tab */}
          <TabsContent value="outlets" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">AI-Scored Outlets</CardTitle>
                <CardDescription className="text-slate-400">High-probability outlets for your paper</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Nature Communications", score: 92, category: "Journal" },
                    { name: "Science Advances", score: 88, category: "Journal" },
                    { name: "PLOS ONE", score: 85, category: "Journal" },
                    { name: "The Guardian", score: 72, category: "Newspaper" },
                    { name: "Wired", score: 68, category: "Magazine" },
                  ].map((outlet) => (
                    <div key={outlet.name} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{outlet.name}</p>
                        <p className="text-slate-400 text-sm">{outlet.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-lg">{outlet.score}%</p>
                        <p className="text-slate-400 text-xs">acceptance probability</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Citations Tab */}
          <TabsContent value="citations" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Citation Generator</CardTitle>
                  <CardDescription className="text-slate-400">Generate legal citations in any format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 text-sm font-medium">Case Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Roe v. Wade"
                        className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm font-medium">Citation Format</label>
                      <select className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
                        <option>Bluebook</option>
                        <option>ALWD</option>
                        <option>APA</option>
                        <option>MLA</option>
                        <option>Chicago</option>
                        <option>Harvard</option>
                        <option>IEEE</option>
                      </select>
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Generate Citation</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Case Law Search</CardTitle>
                  <CardDescription className="text-slate-400">Search free case law databases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 text-sm font-medium">Search Query</label>
                      <input
                        type="text"
                        placeholder="e.g., constitutional rights"
                        className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm font-medium">Court (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., U.S. Supreme Court"
                        className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
                      />
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Search Cases</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
